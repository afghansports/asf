import Image from "next/image";

type FillImageProps = {
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
};

type FixedImageProps = FillImageProps & {
  width: number;
  height: number;
};

export function FillImage({ src, alt = "", className = "object-cover", sizes = "64px" }: FillImageProps) {
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} unoptimized />;
}

export function FixedImage({
  src,
  alt = "",
  width,
  height,
  className = "object-contain",
}: FixedImageProps) {
  return <Image src={src} alt={alt} width={width} height={height} className={className} unoptimized />;
}
