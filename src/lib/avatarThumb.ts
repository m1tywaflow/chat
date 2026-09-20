const CLOUDINARY_UPLOAD_MARKER = "/upload/";
const TRANSFORMATION_PREFIX = /^(?:a_|ar_|b_|bo_|c_|co_|dpr_|e_|f_|fl_|g_|h_|if_|l_|o_|p_|q_|r_|so_|t_|u_|w_|x_|y_|z_)/;

/** Returns a small Cloudinary delivery URL without changing non-Cloudinary URLs. */
export function avatarThumb(url: string, size: number): string {
  if (!url.includes("res.cloudinary.com") || !url.includes(CLOUDINARY_UPLOAD_MARKER)) {
    return url;
  }

  const [before, after] = url.split(CLOUDINARY_UPLOAD_MARKER);
  const firstSegment = after.split("/")[0];

  // Do not stack transformations onto an already transformed delivery URL.
  if (firstSegment.includes(",") || TRANSFORMATION_PREFIX.test(firstSegment)) {
    return url;
  }

  return `${before}${CLOUDINARY_UPLOAD_MARKER}w_${size},h_${size},c_fill,g_auto,f_auto,q_auto/${after}`;
}
