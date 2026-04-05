import re

def strip_md_code_blocks(text: str) -> str:
    """
    完全忽略被 ``` 包裹的代码块。
    """
    lines = text.splitlines()
    out = []
    in_code = False
    for line in lines:
        if line.strip().startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        out.append(line)
    return "\n".join(out)

def clean_markdown(text: str) -> str:
    """
    进一步清理 markdown 元素，使其更适合 TTS 朗读。
    处理包括：去除标题井号、列表星号、链接格式、图片格式、行内代码反引号等。
    """
    # 1. 剥离代码块
    text = strip_md_code_blocks(text)
    
    # 2. 清理图片: '![alt](url)' -> 'alt'
    text = re.sub(r'!\[([^\]]*)\]\([^\)]+\)', r'\1 ', text)
    
    # 3. 清理链接: '[text](url)' -> 'text'
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1 ', text)
    
    # 4. 清理标题: '# Title' -> 'Title'，并加空行保证停顿
    text = re.sub(r'^#{1,6}\s+(.*)$', r'\n\1\n', text, flags=re.MULTILINE)
    
    # 5. 清理无序列表: '- item' 或 '* item' -> 'item'
    text = re.sub(r'^[\-\*]\s+(.*)$', r'\1', text, flags=re.MULTILINE)
    
    # 6. 清理引用: '> text' -> 'text'
    text = re.sub(r'^>\s?(.*)$', r'\1', text, flags=re.MULTILINE)
    
    # 7. 清理粗体/斜体/行内代码的反引号: '**text**', '*text*', '`text`' -> 'text'
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    
    # 8. 清理 HTML 标签: '<br/>', '<span>' -> ' '
    text = re.sub(r'<[^>]+>', ' ', text)
    
    # 9. 规范化空白字符（将多余的空格或制表符缩减为一个空格）
    text = re.sub(r'[ \t]+', ' ', text)
    
    # 10. 彻底清理所有的 Emoji (表情符号) 
    # MeloTTS 等模型在字典里找不到 emoji (比如 🚀, ✨ 等) 就会抛出 Ignore OOV 警告，
    # 甚至有些底层 C++ 词典匹配代码会直接因为非预期字符崩溃。
    import emoji
    text = emoji.replace_emoji(text, replace='')
    
    # 11. 清理多余空行（最多保留两个换行符作为段落分割）
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()
