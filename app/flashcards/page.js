"use client";

import { useEffect, useState } from "react";
import {
  CollectionReference,
  doc,
  getDoc,
  setDoc,
  collection,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export default function Flashcards() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [flashcards, setFlashcards] = useState([]);
  const router = useRouter();

    


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

  if (!isLoaded || !isSignedIn) {
    return <></>;
  }

  const handleCardClick = (id) => {
    router.push(`/flashcard?id=${id}`);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {flashcards.map((flashcard, index) => (
          <Card key={index}>
            <Button
              variant="ghost"
              className="w-full h-full"
              onClick={() => handleCardClick(flashcard.id)}
            >
              <CardContent>
                <h2 className="text-xl font-semibold">{flashcard.name}</h2>
              </CardContent>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
