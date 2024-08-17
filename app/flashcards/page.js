"use client";

import { useEffect, useState } from "react";
import { doc, collection, getDocs, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Flashcards() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [flashcards, setFlashcards] = useState([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function getFlashcards() {
      if (!user) return;

      let flashcards = [];

      if (search) {
        const colRef = collection(doc(collection(db, "users"), user.id), search);
        const docs = await getDocs(colRef);
        docs.forEach((doc) => {
          flashcards.push({ id: doc.id, ...doc.data() });
        });
      } else {
        const docRef = doc(collection(db, "users"), user.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          flashcards = docSnap.data().flashcards || [];
        } else {
          await setDoc(docRef, { flashcards: [] });
        }
      }

      setFlashcards(flashcards);
    }

    getFlashcards();
  }, [user, search]);

  if (!isLoaded || !isSignedIn) {
    return <></>;
  }

  const handleCardClick = (id) => {
    router.push(`/flashcard?id=${id}`);
  };

  return (
    <div className="w-full">
      <input 
        type="text" 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        placeholder="Search flashcards" 
        className="mb-4 p-2 border rounded"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {flashcards.map((flashcard, index) => (
          <Card key={index}>
            <Button
              variant="ghost"
              className="w-full h-full"
              onClick={() => handleCardClick(flashcard.name)}
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
