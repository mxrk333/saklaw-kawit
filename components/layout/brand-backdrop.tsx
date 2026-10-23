import Image from "next/image";

/** Large, blurred Saklaw Kawit seal fixed behind page content. */
export function BrandBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Image
        src="/brand/saklaw-kawit-logo.png"
        alt=""
        width={800}
        height={800}
        sizes="90vmin"
        className="absolute left-1/2 top-1/2 size-[90vmin] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-20 blur-2xl"
      />
    </div>
  );
}
