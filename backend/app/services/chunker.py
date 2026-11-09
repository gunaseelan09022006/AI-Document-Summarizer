from typing import List

def chunk_text(text: str, max_chunk_chars: int = 12000, overlap_chars: int = 500) -> List[str]:
    """
    Split text into chunks of at most `max_chunk_chars` characters,
    splitting at paragraph or sentence boundaries with `overlap_chars` context.
    """
    if not text:
        return []

    if len(text) <= max_chunk_chars:
        return [text]

    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = []
    current_length = 0

    for para in paragraphs:
        para_clean = para.strip()
        if not para_clean:
            continue

        para_len = len(para_clean)

        # If a single paragraph is larger than max_chunk_chars, split by sentences
        if para_len > max_chunk_chars:
            if current_chunk:
                chunks.append("\n\n".join(current_chunk))
                current_chunk = []
                current_length = 0

            # Split huge paragraph by sentence boundaries
            import re
            sentences = re.split(r"(?<=[.!?])\s+", para_clean)
            sub_chunk = []
            sub_len = 0
            for sent in sentences:
                if sub_len + len(sent) > max_chunk_chars and sub_chunk:
                    chunks.append(" ".join(sub_chunk))
                    sub_chunk = [sent]
                    sub_len = len(sent)
                else:
                    sub_chunk.append(sent)
                    sub_len += len(sent) + 1
            if sub_chunk:
                chunks.append(" ".join(sub_chunk))
            continue

        if current_length + para_len + 2 > max_chunk_chars:
            chunks.append("\n\n".join(current_chunk))
            # Keep overlap if possible
            if overlap_chars > 0 and current_chunk:
                overlap_text = current_chunk[-1]
                if len(overlap_text) <= overlap_chars:
                    current_chunk = [overlap_text, para_clean]
                    current_length = len(overlap_text) + para_len + 2
                else:
                    current_chunk = [para_clean]
                    current_length = para_len
            else:
                current_chunk = [para_clean]
                current_length = para_len
        else:
            current_chunk.append(para_clean)
            current_length += para_len + 2

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks

