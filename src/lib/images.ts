/**
 * Curated image assets for Dinemate.
 *
 * Food photography sourced from Unsplash (free for commercial use under the
 * Unsplash License). UNC landmarks sourced from Wikimedia Commons under
 * Creative Commons licenses with credit retained in the colophon.
 */

export interface RemoteImage {
  src: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

const unsplash = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const HERO_FOOD: RemoteImage = {
  src: unsplash("photo-1490645935967-10de6ba17061", 1600),
  alt: "A fresh bowl with avocado, soft-boiled egg, watermelon radish and grains on a rustic wooden surface.",
  credit: "Brooke Lark / Unsplash",
  creditUrl: "https://unsplash.com/photos/08bOYnH_r_E",
};

export const STEP_TELL_US: RemoteImage = {
  src: unsplash("photo-1466637574441-749b8f19452f", 900),
  alt: "Wooden cutting board with avocado, mushrooms, cherry tomatoes, eggs and herbs.",
  credit: "Maarten van den Heuvel / Unsplash",
  creditUrl: "https://unsplash.com/photos/EzH46XCDQRY",
};

export const STEP_MATH: RemoteImage = {
  src: unsplash("photo-1546069901-ba9599a7e63c", 900),
  alt: "Colorful balanced bowl with tofu, edamame, corn, tomatoes and greens — top-down view.",
  credit: "Anh Nguyen / Unsplash",
  creditUrl: "https://unsplash.com/photos/fDb-DyBMlYY",
};

export const STEP_EAT: RemoteImage = {
  src: unsplash("photo-1504674900247-0877df9cc836", 900),
  alt: "Three plates of food on a wooden table — a magazine-style spread.",
  credit: "Kristiana Pinne / Unsplash",
  creditUrl: "https://unsplash.com/photos/8mbzTfoaY3w",
};

export const UNC_OLD_WELL: RemoteImage = {
  src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Old_Well_and_McCorkle_Place_2005.jpg/1280px-Old_Well_and_McCorkle_Place_2005.jpg",
  alt: "The Old Well at UNC Chapel Hill, surrounded by spring azalea blooms.",
  credit: "Wikimedia Commons (CC BY-SA)",
  creditUrl:
    "https://commons.wikimedia.org/wiki/File:Old_Well_and_McCorkle_Place_2005.jpg",
};
