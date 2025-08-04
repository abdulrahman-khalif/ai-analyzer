// app/lib/pdf2img.ts

export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any;

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult> {
  try {
    if (!pdfjsLib) {
      const pdfModule = await import("pdfjs-dist/build/pdf");
      const workerSrc = await import("pdfjs-dist/build/pdf.worker.min?url");
      pdfModule.GlobalWorkerOptions.workerSrc = workerSrc.default;
      pdfjsLib = pdfModule;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context not available.");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const imageFile = new File(
            [blob],
            file.name.replace(/\.pdf$/, ".png"),
            {
              type: "image/png",
            }
          );

          resolve({
            imageUrl: URL.createObjectURL(blob),
            file: imageFile,
          });
        } else {
          resolve({
            imageUrl: "",
            file: null,
            error: "Failed to create image blob",
          });
        }
      }, "image/png");
    });
  } catch (error) {
    console.error("Error converting PDF to image:", error);
    return {
      imageUrl: "",
      file: null,
      error: "PDF to image conversion failed",
    };
  }
}
