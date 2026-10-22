/** Rasterize the authenticated preview into actual JPEG bytes. */
export async function downloadProfileCard() {
  const response = await fetch("/api/profile-card", { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) throw new Error("Your card could not be loaded. Please retry.");
  const source = URL.createObjectURL(await response.blob());
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Your card could not be prepared. Please retry."));
      image.src = source;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth * 2;
    canvas.height = image.naturalHeight * 2;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image downloads are unavailable in this browser.");
    context.fillStyle = "#15121e";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const jpeg = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob?.type === "image/jpeg") resolve(blob);
        else reject(new Error("JPEG export is unavailable in this browser."));
      }, "image/jpeg", 0.95);
    });
    const downloadURL = URL.createObjectURL(jpeg);
    const link = document.createElement("a");
    try {
      link.href = downloadURL;
      link.download = "algogym-profile.jpg";
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadURL), 1000);
    }
  } finally {
    URL.revokeObjectURL(source);
  }
}
