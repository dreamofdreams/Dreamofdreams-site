import xml.etree.ElementTree as ET
import sys

def extract_text(xml_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    # Namespace dictionary for wordprocessingML
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    text = []
    for p in root.findall(".//w:p", ns):
        paragraph = ""
        for r in p.findall(".//w:r", ns):
            t = r.find("w:t", ns)
            if t is not None and t.text:
                paragraph += t.text
        if paragraph:
            text.append(paragraph)
    return "\n".join(text)

# We are only extracting from document.xml as it contains the main text body
print(extract_text("/home/dreamofdreams/.gemini/tmp/doc_extract/word/document.xml"))
