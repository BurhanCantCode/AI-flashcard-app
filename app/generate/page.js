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
import { db } from "@/firebase"; // Ensure correct Firebase import

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

  // Function to navigate to the collections page
  const handleCollections = () => {
    router.push("/flashcards");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <style>{flipCardStyles}</style>
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
            <div className="flex space-x-4">
              <Button variant="default" onClick={handleSubmit}>
                Submit
              </Button>
              <Button variant="outline" onClick={handleCollections}>
                Your Collections
              </Button>
            </div>
          </div>
        </div>
      </div>

      {flashcards.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Flashcards Preview</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {flashcards.map((flashcard, index) => (
              <div
                className={`flip-card ${flipped[index] ? "flip-card-flip" : ""}`}
                key={index}
                onClick={() => handleCardClick(index)}
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
