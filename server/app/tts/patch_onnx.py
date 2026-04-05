import onnx
import sys
import os

def patch_model(model_path):
    print(f"Checking model metadata for: {model_path}")
    model = onnx.load(model_path)
    
    existing_keys = [prop.key for prop in model.metadata_props]
    print(f"Existing metadata keys: {existing_keys}")
    
    needs_save = False
    
    if "comment" not in existing_keys:
        print("Missing 'comment' metadata. Injecting it now...")
        meta = model.metadata_props.add()
        meta.key = "comment"
        meta.value = "Patched by LocalVoice Auto-Fixer"
        needs_save = True
        
    if "add_blank" not in existing_keys:
        print("Missing 'add_blank' metadata. Injecting it now...")
        meta = model.metadata_props.add()
        meta.key = "add_blank"
        # 默认使用 1，但如果模型不需要 blank，可能导致发音错误。这里作为保底策略。
        meta.value = "1"
        needs_save = True

    if "sample_rate" not in existing_keys:
        print("Missing 'sample_rate' metadata. Injecting it now (defaulting to 22050)...")
        meta = model.metadata_props.add()
        meta.key = "sample_rate"
        # VITS/Matcha 模型通常是 22050
        meta.value = "22050"
        needs_save = True

    if "punctuation" not in existing_keys:
        print("Missing 'punctuation' metadata. Injecting it now...")
        meta = model.metadata_props.add()
        meta.key = "punctuation"
        meta.value = "，。！？、；：,.!?;:"
        needs_save = True
        
    # Matcha TTS 等非 VITS 模型可能需要 'jieba' 作为 frontend
    if "frontend" not in existing_keys:
        print("Missing 'frontend' metadata. Injecting it now...")
        meta = model.metadata_props.add()
        meta.key = "frontend"
        meta.value = "jieba"
        needs_save = True
        
    if needs_save:
        # Save back to the same file
        onnx.save(model, model_path)
        print(f"Model successfully patched and saved: {model_path}")
    else:
        print("Model already contains necessary metadata. No changes made.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python patch_onnx.py <path_to_model.onnx>")
        sys.exit(1)
        
    model_file = sys.argv[1]
    if not os.path.exists(model_file):
        print(f"Error: File not found: {model_file}")
        sys.exit(1)
        
    patch_model(model_file)
