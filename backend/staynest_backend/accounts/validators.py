# accounts/validators.py
import os
from rest_framework import serializers

ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def validate_id_proof(file_obj):
    """
    Raises serializers.ValidationError on invalid file.
    Accepts InMemoryUploadedFile or TemporaryUploadedFile from Django.
    """
    if not file_obj:
        return

    # Size check
    if file_obj.size > MAX_FILE_SIZE:
        raise serializers.ValidationError("File too large. Max size is 5 MB.")

    # Content type check (Django usually provides content_type for uploaded files)
    content_type = getattr(file_obj, "content_type", None)
    if content_type:
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError("Unsupported file type. Allowed: pdf, jpg, png.")
        return

    # Fallback to extension check if content_type missing
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in [".pdf", ".jpg", ".jpeg", ".png"]:
        raise serializers.ValidationError("Unsupported file extension. Allowed: pdf, jpg, png.")
