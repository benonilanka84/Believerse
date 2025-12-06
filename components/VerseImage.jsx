"use client";

import { useRef } from "react";

export default function VerseImage({ verse }) {
  const canvasRef = useRef(null);

  const generateImage = () => {
    if (!verse) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 600, 800);
    gradient.addColorStop(0, "#0b2e4a");
    gradient.addColorStop(1, "#2e8b57");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 800);

    // Text styling
    ctx.fillStyle = "white";
    ctx.font = "28px Georgia";
    ctx.textAlign = "center";

    const text = `"${verse.text}"`;
    wrapText(ctx, text, 300, 300, 500, 36);

    ctx.font = "22px Arial";
    ctx.fillText(`— ${verse.bookname} ${verse.chapter}:${verse.verse}`, 300, 550);
  };

  const shareImage = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const file = new File([blob], "verse.png", { type: "image/png" });
      const url = URL.createObjectURL(file);
      window.open(`https://wa.me/?text=${url}`, "_blank");
    });
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "verse.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(" ");
    let line = "";

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(line, x, y);
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={800}
        style={{
          display: "block",
          width: "300px",
          height: "400px",
          borderRadius: "16px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
        }}
      ></canvas>

      <div style={{ marginTop: "10px" }}>
        <button className="btn-primary" onClick={generateImage}>
          Generate Image
        </button>

        <button className="btn-primary" onClick={downloadImage}>
          Download
        </button>

        <button className="btn-primary" onClick={shareImage}>
          Share to WhatsApp
        </button>
      </div>
    </div>
  );
}
