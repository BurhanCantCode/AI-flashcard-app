"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export default function Flashcard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [flashcards, setFlashcards] = useState([]);
  const [flipped, setFlipped] = useState({});

  const searchParams = useSearchParams();
  const search = searchParams.get("id");

  useEffect(() => {
    async function getFlashcard() {
      if (!search || !user) return;
      const colRef = collection(doc(collection(db, "users"), user.id), search);
      const docs = await getDocs(colRef);
      const flashcards = [];

      docs.forEach((doc) => {
        flashcards.push({ id: doc.id, ...doc.data() });
      });
      setFlashcards(flashcards);
    }

    getFlashcard();
  }, [user, search]);

  const handleCardClick = (id) => {
    setFlipped((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid gap-4 mt-4">
        {flashcards.length > 0 && (
          <div className="mt-4">
            <h2 className="text-2xl font-bold mb-4">Flashcards Preview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {flashcards.map((flashcard, index) => (
                <Card key={index} className="overflow-hidden">
                  <Button
                    variant="ghost"
                    className="w-full h-full p-0"
                    onClick={() => handleCardClick(index)}
                  >
                    <CardContent className="p-0">
                      <div
                        className={`relative w-full h-48 transition-transform duration-600 transform-gpu ${
                          flipped[index] ? "rotate-y-180" : ""
                        }`}
                        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
                      >
                        <div className="absolute w-full h-full backface-hidden flex justify-center items-center p-4">
                          <h3 className="text-lg font-medium">
                            {flashcard.front}
                          </h3>
                        </div>
                        <div className="absolute w-full h-full backface-hidden flex justify-center items-center p-4 [transform:rotateY(180deg)]">
                          <h3 className="text-lg font-medium">
                            {flashcard.back}
                          </h3>
                        </div>
                      </div>
                    </CardContent>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
