import React, { useState } from "react";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = "/Images/2e.jpg",
  className = "",
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);

  const finalSrc = error || !src ? fallbackSrc : src;

  return (
    <img
      src={finalSrc}
      alt={alt || "Product image"}
      onError={() => {
        if (!error) setError(true);
      }}
      className={className}
      {...props}
    />
  );
}
