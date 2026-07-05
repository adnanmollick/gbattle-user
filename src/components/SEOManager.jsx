import { useEffect } from "react";
import { useSettings } from "../hooks/useSettings";

// Dynamically updates meta tags from admin settings
export default function SEOManager() {
  const settings = useSettings();

  useEffect(() => {
    if (settings.seoTitle) document.title = settings.seoTitle;

    const setMeta = (selector, attr, value) => {
      if (!value) return;
      let el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', "content", settings.seoDescription);
    setMeta('meta[name="keywords"]', "content", settings.seoKeywords);
    setMeta('meta[property="og:title"]', "content", settings.seoTitle);
    setMeta('meta[property="og:description"]', "content", settings.seoDescription);
    if (settings.seoImage) setMeta('meta[property="og:image"]', "content", settings.seoImage);
  }, [settings.seoTitle, settings.seoDescription, settings.seoKeywords, settings.seoImage]);

  return null;
}
