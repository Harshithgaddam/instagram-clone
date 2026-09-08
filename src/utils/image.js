/* =====================================
   Responsive image srcSet
   ===================================== */

export const getResponsiveSrcSet = (src) => {
  if (!src) {
    return undefined;
  }

  const match = src.match(
    /https:\/\/picsum\.photos\/id\/(\d+)\/\d+\/\d+/
  );

  if (!match) {
    return undefined;
  }

  const id = match[1];

  return `
    https://picsum.photos/id/${id}/200/200 200w,
    https://picsum.photos/id/${id}/300/300 300w,
    https://picsum.photos/id/${id}/400/400 400w
  `;
};

/* =====================================
   Preload one image
   ===================================== */

export const preloadImage = (src) =>
  new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        src,
        status: "loaded",
      });
    };

    image.onerror = () => {
      resolve({
        src,
        status: "error",
      });
    };

    image.src = src;
  });