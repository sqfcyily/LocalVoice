import re
import logging

logger = logging.getLogger(__name__)

def split_text_by_punctuation(text: str, max_chars: int = 300) -> list[str]:
    """
    按标点符号切分长文本，确保每个片段不超过 max_chars，防止 TTS 引擎 OOM 或超时。
    """
    if not text.strip():
        return []
        
    # 定义中英文主要的切分断句标点，包括换行符
    # 优先切分：换行符、句号、问号、感叹号、分号
    punctuations = r'([\n。！？；.?!;])'
    
    parts = re.split(punctuations, text)
    
    segments = []
    current_segment = ""
    
    for part in parts:
        if not part:
            continue
            
        # 如果是标点符号或换行符，附加到上一个 segment 上
        if re.match(punctuations, part):
            current_segment += part
            continue
            
        # 如果当前 part 加上已有的长度超过了 max_chars，且已有内容不为空，就推送
        if len(current_segment) + len(part) > max_chars and current_segment.strip():
            segments.append(current_segment.strip())
            current_segment = part
        else:
            current_segment += part
            
    if current_segment.strip():
        segments.append(current_segment.strip())
        
    # 二次保险：如果存在没有任何标点符号且长度超过 max_chars 的单句，进行硬切分
    final_segments = []
    for seg in segments:
        while len(seg) > max_chars:
            # 找到在 max_chars 以内的最后一个逗号或顿号进行软切分
            soft_cut_idx = max(seg.rfind('，', 0, max_chars), seg.rfind(',', 0, max_chars), seg.rfind('、', 0, max_chars))
            
            if soft_cut_idx > 0:
                final_segments.append(seg[:soft_cut_idx+1].strip())
                seg = seg[soft_cut_idx+1:]
            else:
                # 找不到任何标点，只能硬切分
                logger.warning(f"强制硬切分超长片段 (无标点超过 {max_chars} 字符)")
                final_segments.append(seg[:max_chars])
                seg = seg[max_chars:]
                
        if seg.strip():
            final_segments.append(seg.strip())
            
    # 最后过滤掉空段落
    return [s for s in final_segments if s.strip()]
