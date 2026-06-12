export async function exportElementAsPNG(elementId: string, filename: string): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    backgroundColor: "#FBF8F3",
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
