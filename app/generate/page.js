"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { collection, doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "@/firebase"; // Make sure to correctly import your Firebase configuration

export default function Generate() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [flashcards, setFlashcards] = useState([]);
  const [flipped, setFlipped] = useState({});
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Function to handle form submission and generate flashcards
  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setFlashcards(data);
    } catch (error) {
      console.error("Error generating flashcards:", error);
    }
  };

  // Function to handle flipping a flashcard
  const handleCardClick = (id) => {
    setFlipped((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Function to open the dialog
  const handleOpen = () => {
    setOpen(true);
  };

  // Function to close the dialog
  const handleClose = () => {
    setOpen(false);
  };

  // Function to save flashcards to Firestore
  const saveFlashcards = async () => {
    if (!isSignedIn || !user) {
      alert("Please sign in to save flashcards");
      return;
    }

    if (!name) {
      alert("Please enter a name");
      return;
    }

    const batch = writeBatch(db);
    const userDocRef = doc(collection(db, "users"), user.id);
    const docSnap = await getDoc(userDocRef);

    let collections = [];

    if (docSnap.exists()) {
      collections = docSnap.data().flashcards || [];
      if (collections.find((f) => f.name === name)) {
        alert("Flashcard collection with the same name already exists.");
        return;
      } else {
        collections.push({ name });
        batch.set(userDocRef, { flashcards: collections }, { merge: true });
      }
    } else {
      batch.set(userDocRef, { flashcards: [{ name }] });
    }

    const colRef = collection(userDocRef, name);
    flashcards.forEach((flashcard) => {
      const cardDocRef = doc(colRef);
      batch.set(cardDocRef, flashcard);
    });

    await batch.commit();
    handleClose();
    router.push("/flashcards");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mt-8 mb-12 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6">Generate Flashcards</h1>
        <div className="w-full p-6 rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text"
              className="mb-4 w-full"
              rows={4}
            />
            <Button variant="default" onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        </div>
      </div>

      {flashcards.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Flashcards Preview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {flashcards.map((flashcard, index) => (
              <Card
                key={index}
                className="cursor-pointer"
                onClick={() => handleCardClick(index)}
              >
                <CardContent className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">
                      {flipped[index] ? flashcard.back : flashcard.front}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">
                      {flipped[index] ? "Back" : "Front"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button variant="secondary" onClick={handleOpen} disabled={!isSignedIn}>
              Save
            </Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Flashcards</DialogTitle>
            <DialogDescription>
              Please enter a name for your flashcards collection
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Collection Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={saveFlashcards}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
