# ComfyUI Text-to-Image API Documentation

## API Overview

This document describes the ComfyUI text-to-image generation API interface, including all frontend configurable parameters and their usage.

## Base Information

- **API Endpoint**: `https://api.runpod.ai/v2/{ENDPOINT_ID}/runsync`
- **Method**: POST
- **Content-Type**: application/json
- **Authentication**: Bearer token required

## Request Headers

```json
{
  "Authorization": "Bearer {RUNPOD_API_KEY}",
  "Content-Type": "application/json"
}
```

## Request Structure

```json
{
  "input": {
    "workflow": {
      // Workflow nodes (see detailed structure below)
    },
    "images": [
      // Base64 encoded images for img2img (optional)
    ]
  }
}
```

## Frontend Configuration Fields

### 1. Basic Generation Settings

#### Text Prompts
- **Field**: `prompt` (string)
- **Description**: Main text prompt for image generation
- **Example**: "A beautiful landscape with mountains and lakes"
- **Required**: Yes

- **Field**: `negative_prompt` (string)
- **Description**: Negative prompt to avoid certain elements
- **Example**: "blurry, low quality, distorted"
- **Required**: No
- **Default**: ""

#### Image Quality Settings
- **Field**: `width` (integer)
- **Description**: Output image width in pixels
- **Range**: 512-2048
- **Default**: 1080
- **Common Values**: 
  - 1080×1440 (3:4 HD)
  - 1024×1024 (Square)
  - 1344×768 (16:9)

- **Field**: `height` (integer)
- **Description**: Output image height in pixels
- **Range**: 512-2048
- **Default**: 1440

- **Field**: `batch_size` (integer)
- **Description**: Number of images to generate
- **Range**: 1-4
- **Default**: 2

### 2. Model Configuration

#### Checkpoint Model
- **Field**: `checkpoint_name` (string)
- **Description**: Main diffusion model to use
- **Default**: "pornworksBadBoysPhoto.safetensors"
- **Available Options**:
  - "pornworksBadBoysPhoto.safetensors"
  - "photorealisticAllPurpose_v30.safetensors"
  - Custom model name (user input)

### 3. Generation Parameters

#### Sampling Configuration
- **Field**: `steps` (integer)
- **Description**: Number of sampling steps
- **Range**: 1-100
- **Default**: 30 (standard), 4 (Lightning LoRA)
- **Recommendations**:
  - Lightning LoRA: 4 steps
  - Standard models: 20-30 steps

- **Field**: `cfg` (float)
- **Description**: CFG (Classifier-Free Guidance) scale
- **Range**: 0-30
- **Default**: 4 (standard), 1 (Lightning LoRA)
- **Recommendations**:
  - Lightning LoRA: 1
  - Standard models: 7-12

#### Sampling Algorithm
- **Field**: `sampler_name` (string)
- **Description**: Sampling algorithm to use
- **Default**: "dpmpp_3m_sde_gpu" (standard), "euler" (Lightning LoRA)
- **Available Options**:
  - "euler"
  - "euler_ancestral"
  - "heun"
  - "dpm_2"
  - "dpm_2_ancestral"
  - "lms"
  - "dpm_fast"
  - "dpm_adaptive"
  - "dpmpp_2s_ancestral"
  - "dpmpp_sde"
  - "dpmpp_sde_gpu"
  - "dpmpp_2m"
  - "dpmpp_2m_sde"
  - "dpmpp_2m_sde_gpu"
  - "dpmpp_3m_sde"
  - "dpmpp_3m_sde_gpu"
  - "ddpm"
  - "lcm"

#### Noise Scheduler
- **Field**: `scheduler` (string)
- **Description**: Noise scheduling algorithm
- **Default**: "karras" (standard), "sgm_uniform" (Lightning LoRA)
- **Available Options**:
  - "normal"
  - "karras"
  - "exponential"
  - "sgm_uniform"
  - "simple"
  - "ddim_uniform"
  - "beta"
  - "linear_quadratic"
  - "kl_optimal"

#### Randomization
- **Field**: `seed` (integer)
- **Description**: Random seed for reproducible results
- **Range**: 0-2147483647
- **Default**: Random value
- **Special**: -1 for random seed

### 4. LoRA Configuration

#### LoRA Models
- **Field**: `loras` (array of objects)
- **Description**: List of LoRA models to apply
- **Default**: [] (empty array)
- **Structure**:
```json
{
  "name": "sdxl_lightning_4step_lora.safetensors",
  "strength_model": 1.0,
  "strength_clip": 3.0
}
```

#### LoRA Parameters
- **Field**: `lora_name` (string)
- **Description**: LoRA model filename
- **Examples**:
  - "sdxl_lightning_4step_lora.safetensors"
  - "add-detail-xl.safetensors"

- **Field**: `strength_model` (float)
- **Description**: LoRA model strength
- **Range**: 0-2.0
- **Default**: 1.0

- **Field**: `strength_clip` (float)
- **Description**: LoRA CLIP strength
- **Range**: 0-3.0
- **Default**: 1.0

### 5. Generation Type

#### Mode Selection
- **Field**: `generation_type` (string)
- **Description**: Generation mode
- **Options**:
  - "text2img": Text to image generation
  - "img2img": Image to image generation
- **Default**: "text2img"

#### Image-to-Image Settings
- **Field**: `reference_image` (string)
- **Description**: Base64 encoded reference image
- **Required**: Only for img2img mode
- **Format**: "data:image/jpeg;base64,{base64_string}"

- **Field**: `denoise` (float)
- **Description**: Denoising strength for img2img
- **Range**: 0-1.0
- **Default**: 0.75
- **Usage**: Only for img2img mode

## Parameter Presets

### Lightning LoRA Mode
When `sdxl_lightning_4step_lora.safetensors` is enabled:
```json
{
  "steps": 4,
  "cfg": 1,
  "sampler_name": "euler",
  "scheduler": "sgm_uniform"
}
```

### Standard Mode
Default parameters for standard models:
```json
{
  "steps": 30,
  "cfg": 4,
  "sampler_name": "dpmpp_3m_sde_gpu",
  "scheduler": "karras"
}
```

## Complete Request Example

### Text-to-Image with Lightning LoRA
```json
{
  "input": {
    "workflow": {
      "1": {
        "inputs": {
          "ckpt_name": "pornworksBadBoysPhoto.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "2": {
        "inputs": {
          "lora_name": "sdxl_lightning_4step_lora.safetensors",
          "strength_model": 1.0,
          "strength_clip": 3.0,
          "model": ["1", 0],
          "clip": ["1", 1]
        },
        "class_type": "LoraLoader"
      },
      "3": {
        "inputs": {
          "text": "A beautiful landscape with mountains and lakes",
          "clip": ["2", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "4": {
        "inputs": {
          "text": "blurry, low quality, distorted",
          "clip": ["2", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "5": {
        "inputs": {
          "width": 1080,
          "height": 1440,
          "batch_size": 2
        },
        "class_type": "EmptyLatentImage"
      },
      "6": {
        "inputs": {
          "seed": 123456,
          "steps": 4,
          "cfg": 1,
          "sampler_name": "euler",
          "scheduler": "sgm_uniform",
          "denoise": 1.0,
          "model": ["2", 0],
          "positive": ["3", 0],
          "negative": ["4", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },
      "7": {
        "inputs": {
          "samples": ["6", 0],
          "vae": ["1", 2]
        },
        "class_type": "VAEDecode"
      },
      "8": {
        "inputs": {
          "images": ["7", 0]
        },
        "class_type": "SaveImage"
      }
    }
  }
}
```

### Standard Text-to-Image (No LoRA)
```json
{
  "input": {
    "workflow": {
      "1": {
        "inputs": {
          "ckpt_name": "pornworksBadBoysPhoto.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "2": {
        "inputs": {
          "text": "A beautiful landscape with mountains and lakes",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "3": {
        "inputs": {
          "text": "blurry, low quality, distorted",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "4": {
        "inputs": {
          "width": 1080,
          "height": 1440,
          "batch_size": 2
        },
        "class_type": "EmptyLatentImage"
      },
      "5": {
        "inputs": {
          "seed": 123456,
          "steps": 30,
          "cfg": 4,
          "sampler_name": "dpmpp_3m_sde_gpu",
          "scheduler": "karras",
          "denoise": 1.0,
          "model": ["1", 0],
          "positive": ["2", 0],
          "negative": ["3", 0],
          "latent_image": ["4", 0]
        },
        "class_type": "KSampler"
      },
      "6": {
        "inputs": {
          "samples": ["5", 0],
          "vae": ["1", 2]
        },
        "class_type": "VAEDecode"
      },
      "7": {
        "inputs": {
          "images": ["6", 0]
        },
        "class_type": "SaveImage"
      }
    }
  }
}
```

## Response Format

### Success Response
```json
{
  "id": "sync-request-id",
  "status": "COMPLETED",
  "output": {
    "images": [
      {
        "image": "base64_encoded_image_data",
        "seed": 123456,
        "filename": "ComfyUI_00001_.png"
      }
    ],
    "workflow_duration": 3.45,
    "queue_time": 0.12
  }
}
```

### Error Response
```json
{
  "id": "sync-request-id",
  "status": "FAILED",
  "error": {
    "type": "prompt_outputs_failed_validation",
    "message": "Prompt outputs failed validation",
    "details": "ckpt_name: 'invalid_model.safetensors' not in available models",
    "node_errors": {
      "1": {
        "errors": [
          {
            "type": "value_not_in_list",
            "message": "Value not in list"
          }
        ]
      }
    }
  }
}
```

## Frontend Integration Guidelines

### 1. Parameter Validation
- Validate all numeric ranges before sending requests
- Ensure required fields are present
- Check model availability before submission

### 2. Automatic Parameter Adjustment
- When Lightning LoRA is enabled, automatically adjust:
  - Steps: 4
  - CFG: 1
  - Sampler: euler
  - Scheduler: sgm_uniform

### 3. Error Handling
- Parse error responses to show user-friendly messages
- Handle model availability errors gracefully
- Provide fallback options for invalid parameters

### 4. Performance Optimization
- Cache workflow structures for common configurations
- Implement request debouncing for parameter changes
- Show loading states during generation

## Common Use Cases

### 1. Quick Generation (Lightning LoRA)
- Enable `sdxl_lightning_4step_lora.safetensors`
- Use 4 steps, CFG 1
- Fastest generation time (~2-3 seconds)

### 2. High Quality Generation
- Use standard model without LoRA
- 30 steps, CFG 4-8
- Better quality, longer generation time (~10-15 seconds)

### 3. Style Transfer
- Use specific LoRA models
- Adjust model/CLIP strengths
- Combine multiple LoRAs for complex styles

### 4. Batch Generation
- Set batch_size > 1
- Use different seeds for variety
- Monitor memory usage

## Rate Limits and Quotas

- **Concurrent Requests**: 1 per endpoint
- **Queue Limit**: 10 requests
- **Timeout**: 300 seconds
- **Max Image Size**: 2048×2048
- **Max Batch Size**: 4 images

## Best Practices

1. **Model Selection**: Use appropriate models for your use case
2. **Parameter Tuning**: Start with presets, then fine-tune
3. **Error Recovery**: Implement retry logic for transient failures
4. **Resource Management**: Monitor GPU memory usage
5. **User Experience**: Show progress indicators and previews

---

*Last Updated: 2025-01-17*
*Version: 1.0* 