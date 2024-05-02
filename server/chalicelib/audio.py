import os
import requests
from dotenv import find_dotenv, load_dotenv
import boto3
from botocore.exceptions import NoCredentialsError
import io
import uuid


load_dotenv(find_dotenv())

"""
Helper funtions for ElevenLabs (audio) and Amazon S3 (file storage)
"""


# Helper function
def generate_mp3_file_name():
    """
    Generate a random hash for S3 audio files.

    Example: "fs89feq1.mp3"

    Returns
    -------
    A string representing a unique UUID.
    """
    return str(uuid.uuid4()) + ".mp3"


def text_to_audio(message: str) -> bytes:
    """
    Convert a message into an audio file using the Labs API.

    Parameters
    ----------
    message (str): The message to be converted to audio format.

    Returns
    -------
    The byte stream to the audio.

    Pre-Requisite:
    ---------------
    (1) ElevenLabs API Key is added to the `.env`

    Tutorial Reference:
    https://elevenlabs.io/docs/api-reference/text-to-speech
    """
    return


def upload_audio_bytes_to_s3(audio_content, bucket, chat_id, timestamp, s3_obj_name):
    """
    Uploads audio to S3.

    Returns the file name of the audio file.
    """
    # Validation (don't write this)
    if not isinstance(audio_content, bytes):
        print(f"Error: audio_content is not bytes, but {type(audio_content)}")
        return False
    if not bucket:
        print(f"Error: no bucket provided. Bucket: {bucket}")
        return False

    # Upload to S3
    try:
        s3_client = boto3.client("s3")
        audio_file = io.BytesIO(audio_content)
        print(f"Converted to io.BytesIO: {type(audio_file)}")
        extra_args = {
            "ContentType": "audio/mpeg",
            "Metadata": {
                "chat_id": chat_id,
                "timestamp": str(timestamp),
            },
        }
        s3_client.upload_fileobj(audio_file, bucket, s3_obj_name, ExtraArgs=extra_args)
        print(f"✅ Audio upload to {bucket} (bucket) as '{s3_obj_name}'")
        return True
    except Exception as e:
        print(f"An error occurred: {e}")
        return False


def get_playable_audio_link(file_name, bucket_name, expiration=604800):
    """
    Generate a pre-signed URL to access a private S3 object.

    Parameters:
    - file_name: The key/name of the file in the S3 bucket.
    - bucket_name: The name of the S3 bucket.
    - expiration: Time in seconds for the pre-signed URL to remain valid. Default: 7 days (604800 sec)

    Returns:
    - The pre-signed URL string or None if an error occurs.
    """
    # Create a boto3 S3 client
    s3_client = boto3.client("s3")
    try:
        response = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_name, "Key": file_name},
            ExpiresIn=expiration,
        )
    except NoCredentialsError:
        print("Credentials not available for AWS S3")
        return None
    except Exception as e:
        print(f"An error occurred generating the pre-signed URL: {e}")
        return None
    print(f"Got the presigned S3 URL, expires in {expiration} sec: {response}")
    return response
