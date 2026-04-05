import os
import sys
import logging
import numpy as np
import sherpa_onnx

logger = logging.getLogger(__name__)

class TTSEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TTSEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def initialize(self, models_dir: str):
        if self._initialized:
            return
            
        logger.info(f"Scanning models directory: {models_dir}")
        
        # Sherpa-onnx 典型需要 model.onnx, lexicon.txt, tokens.txt, 有的需要 dict 目录
        vits_model = ""
        lexicon = ""
        tokens = ""
        dict_dir = ""
        rule_fsts = ""
        
        for root, dirs, files in os.walk(models_dir):
            for file in files:
                if file.endswith(".onnx"):
                    vits_model = os.path.join(root, file)
                elif file == "lexicon.txt":
                    lexicon = os.path.join(root, file)
                elif file == "tokens.txt":
                    tokens = os.path.join(root, file)
                elif file.endswith(".fst") and "rule" in file:
                    rule_fsts = os.path.join(root, file)
                    
            if "dict" in dirs:
                dict_dir = os.path.join(root, "dict")
        
        if not vits_model:
            logger.warning(f"在 {models_dir} 中未找到 ONNX 模型，TTS 引擎将不可用。")
            self.tts = None
            self.sample_rate = 16000
            return
            
        logger.info(f"加载 TTS 模型: {vits_model}")
        
        vits_config = sherpa_onnx.OfflineTtsVitsModelConfig(
            model=vits_model,
            lexicon=lexicon,
            tokens=tokens,
        )
        if dict_dir:
            vits_config.dict_dir = dict_dir

        model_config = sherpa_onnx.OfflineTtsModelConfig(
            vits=vits_config,
            num_threads=1, # 严格单线程，防止 OOM 和锁死
            debug=False,
            provider="cpu",
        )
        
        tts_config = sherpa_onnx.OfflineTtsConfig(
            model=model_config,
            rule_fsts=rule_fsts,
            max_num_sentences=1,
        )
        
        self.tts = sherpa_onnx.OfflineTts(tts_config)
        self.sample_rate = self.tts.sample_rate
        self._initialized = True
        logger.info(f"TTS 引擎初始化成功，原生采样率: {self.sample_rate}Hz")

    def generate_audio_pcm(self, text: str, sid: int = 0, speed: float = 1.0) -> bytes:
        """
        推理并返回 16-bit PCM 字节流
        """
        if not self._initialized or not self.tts:
            raise RuntimeError("TTS Engine is not initialized or model is missing.")
            
        # audio.samples 是一维 float32 NumPy 数组，范围 [-1.0, 1.0]
        audio = self.tts.generate(text, sid=sid, speed=speed)
        
        if len(audio.samples) == 0:
            return b""
            
        # 转换为 16-bit PCM
        samples_int16 = (audio.samples * 32767).astype(np.int16)
        return samples_int16.tobytes()

# 全局单例
engine = TTSEngine()
