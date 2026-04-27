import { NextFunction, Request, Response, Router } from "express";
import multer, { MulterError } from "multer";
import { uploadImageToCloudinary } from "../services/uploadService";
import { HttpError, sendError, sendSuccess } from "../utils/http";

const router = Router();
const maxFileSizeInBytes = Number(process.env.UPLOAD_MAX_FILE_SIZE_BYTES || 5 * 1024 * 1024);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeInBytes,
    files: 1,
  },
  fileFilter(_req, file, callback) {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
      return;
    }

    callback(new HttpError(400, "File phải là ảnh hợp lệ", {
      code: "INVALID_FILE_TYPE",
      fieldErrors: [
        {
          field: "image",
          message: "Chỉ hỗ trợ upload file ảnh",
        },
      ],
      hint: "Gửi multipart/form-data với file ảnh ở field image",
    }));
  },
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }

  return "Unknown error";
}

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

router.post(
  "/images",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, "Thiếu file ảnh", {
        code: "MISSING_FILE",
        fieldErrors: [
          {
            field: "image",
            message: "Field image là bắt buộc",
          },
        ],
        hint: "Gửi multipart/form-data với file ảnh ở field image",
      });
    }

    const uploaded = await uploadImageToCloudinary(req.file.buffer, req.file.originalname);

    sendSuccess(res, {
      requestId: res.locals.requestId,
      message: "Upload ảnh thành công",
      statusCode: 201,
      data: {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        width: uploaded.width,
        height: uploaded.height,
        format: uploaded.format,
        bytes: uploaded.bytes,
      },
    });
  }),
);

router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      sendError(res, {
        requestId: res.locals.requestId,
        statusCode: 400,
        message: "File vượt quá dung lượng cho phép",
        error: {
          code: "FILE_TOO_LARGE",
          fieldErrors: [
            {
              field: "image",
              message: `Dung lượng tối đa là ${maxFileSizeInBytes} bytes`,
            },
          ],
          hint: "Giảm kích thước ảnh rồi thử lại",
        },
      });
      return;
    }

    sendError(res, {
      requestId: res.locals.requestId,
      statusCode: 400,
      message: "Upload file không hợp lệ",
      error: {
        code: "UPLOAD_ERROR",
        details: [error.message],
      },
    });
    return;
  }

  if (error instanceof HttpError) {
    sendError(res, {
      requestId: res.locals.requestId,
      statusCode: error.statusCode,
      message: error.message,
      error: {
        code: error.code,
        details: error.details,
        fieldErrors: error.fieldErrors,
        hint: error.hint,
      },
    });
    return;
  }

  const message = getErrorMessage(error);
  sendError(res, {
    requestId: res.locals.requestId,
    statusCode: 500,
    message: "Upload ảnh thất bại",
    error: {
      code: "UPLOAD_FAILED",
      details: [message],
      hint: "Kiểm tra CLOUDINARY_URL và thử lại",
    },
  });
});

export default router;
