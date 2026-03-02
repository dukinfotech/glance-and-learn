export const shuffleArray = (array: Array<any>) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Hoán đổi các phần tử
  }
  return array;
};

export const removeFontSize = (text: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  (doc.querySelectorAll("[style]") as NodeListOf<HTMLElement>).forEach(el => {
    el.style.removeProperty("font-size");
  });
  const result = doc.body.innerHTML;
  return result;
};