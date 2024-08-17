"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { doc, getDocs, collection } from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

// CSS styles for the flip effect
const flipCardStyles = `
  .flip-card {
    background-color: transparent;
    width: 300px; /* Fixed width */
    height: 192px; /* Fixed height matching the Generate component */
    perspective: 1000px;
    margin: 15px; /* Space between cards */
  }
  .flip-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.6s;
    transform-style: preserve-3d;
    cursor: pointer;
  }
  .flip-card-flip .flip-card-inner {
    transform: rotateY(180deg);
  }
  .flip-card-front,
  .flip-card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
  }
  .flip-card-front {
    background-color: #fff;
    color: black;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .flip-card-back {
    background-color: #f8f9fa;
    color: black;
    transform: rotateY(180deg);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .flip-card-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export default function Flashcard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [flashcards, setFlashcards] = useState([]);
  const [flipped, setFlipped] = useState({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionName = searchParams.get("id");

  useEffect(() => {
    async function getFlashcards() {
      if (!user || !collectionName) return;

      try {
        const colRef = collection(doc(collection(db, "users"), user.id), collectionName);
        const docs = await getDocs(colRef);
        const flashcardsData = docs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFlashcards(flashcardsData);
      } catch (error) {
        console.error("Error fetching flashcards:", error);
      }
    }

    getFlashcards();
  }, [user, collectionName]);

  const handleCardClick = (id) => {
    setFlipped((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!isLoaded || !isSignedIn) {
    return <p>Loading...</p>;
  }

  return (
    <div className="w-full">
      <style>{flipCardStyles}</style>
      <h1 className="text-3xl font-bold mb-6 text-center">{collectionName}</h1>
      <div className="flex flex-wrap justify-center gap-6">
        {flashcards.map((flashcard) => (
          <div
            className={`flip-card ${flipped[flashcard.id] ? "flip-card-flip" : ""}`}
            key={flashcard.id}
            onClick={() => handleCardClick(flashcard.id)}
          >
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <Card className="flip-card-content">
                  <CardContent>
                    <h2 className="text-xl font-semibold">{flashcard.front}</h2>
                  </CardContent>
                </Card>
              </div>
              <div className="flip-card-back">
                <Card className="flip-card-content">
                  <CardContent>
                    <h2 className="text-xl font-semibold">{flashcard.back}</h2>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
