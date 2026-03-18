import React from "react";
import MileleBookPage from "./MileleBookPage";
import { mileleBookContent } from "../data/mileleBookContent";

export default function MileleBookViewer() {
  const pages = [
    { title: "Introduction", content: mileleBookContent.introduction },
    { title: "Histoire personnelle", content: mileleBookContent.histoirePersonnelle },
    { title: "Pourquoi Milele", content: mileleBookContent.pourquoiMilele },
    { title: "Comment Milele soutient", content: mileleBookContent.soutien },
    { title: "Malaika", content: mileleBookContent.malaika },
    { title: "Pourquoi votre soutien compte", content: mileleBookContent.soutienDonateurs },
    { title: "Impact humain", content: mileleBookContent.impact },
    { title: "Appel aux donateurs", content: mileleBookContent.appel },
    { title: "Citation fondatrice", content: mileleBookContent.citation },
    { title: "Conclusion", content: mileleBookContent.conclusion }
  ];

  return (
    <div>
      {pages.map((p, i) => (
        <MileleBookPage key={i} title={p.title} content={p.content} />
      ))}
    </div>
  );
}