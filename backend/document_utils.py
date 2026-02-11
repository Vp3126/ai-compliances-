"""
Document processing utilities for extracting text from various file formats
"""

import os
from typing import Optional
from docx import Document
import PyPDF2
import io

def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extract text from PDF file
    
    Args:
        file_content: PDF file content as bytes
        
    Returns:
        Extracted text as string
    """
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    """
    Extract text from DOCX file
    
    Args:
        file_content: DOCX file content as bytes
        
    Returns:
        Extracted text as string
    """
    try:
        docx_file = io.BytesIO(file_content)
        doc = Document(docx_file)
        
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from DOCX: {str(e)}")

def extract_text_from_txt(file_content: bytes) -> str:
    """
    Extract text from TXT file
    
    Args:
        file_content: TXT file content as bytes
        
    Returns:
        Extracted text as string
    """
    try:
        return file_content.decode('utf-8').strip()
    except UnicodeDecodeError:
        # Try with different encoding
        try:
            return file_content.decode('latin-1').strip()
        except Exception as e:
            raise ValueError(f"Failed to extract text from TXT: {str(e)}")

def extract_text_from_file(filename: str, file_content: bytes) -> str:
    """
    Extract text from file based on extension
    
    Args:
        filename: Name of the file
        file_content: File content as bytes
        
    Returns:
        Extracted text as string
    """
    file_extension = os.path.splitext(filename)[1].lower()
    
    if file_extension == '.pdf':
        return extract_text_from_pdf(file_content)
    elif file_extension == '.docx':
        return extract_text_from_docx(file_content)
    elif file_extension == '.txt':
        return extract_text_from_txt(file_content)
    else:
        raise ValueError(f"Unsupported file type: {file_extension}. Supported types: .pdf, .docx, .txt")

def validate_file_size(file_size: int, max_size_mb: int = 10) -> bool:
    """
    Validate file size
    
    Args:
        file_size: Size of file in bytes
        max_size_mb: Maximum allowed size in MB
        
    Returns:
        True if valid, raises ValueError otherwise
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        raise ValueError(f"File size ({file_size / 1024 / 1024:.2f} MB) exceeds maximum allowed size ({max_size_mb} MB)")
    return True

def validate_file_type(filename: str, allowed_types: list = ['.pdf', '.docx', '.txt']) -> bool:
    """
    Validate file type
    
    Args:
        filename: Name of the file
        allowed_types: List of allowed file extensions
        
    Returns:
        True if valid, raises ValueError otherwise
    """
    file_extension = os.path.splitext(filename)[1].lower()
    if file_extension not in allowed_types:
        raise ValueError(f"File type {file_extension} not allowed. Allowed types: {', '.join(allowed_types)}")
    return True
