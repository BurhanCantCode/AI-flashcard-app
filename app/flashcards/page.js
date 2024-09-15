"use client"; // Add this directive at the top of the file

import { useEffect, useState } from "react";
import { doc, collection, getDocs, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import getStripe from '@/lib/get-stripe';
import Link from 'next/link'; // Import Link component

export default function Flashcards() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [flashcards, setFlashcards] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [userPlan, setUserPlan] = useState('free'); // Default to free plan
  const router = useRouter();

  useEffect(() => {
    async function getFlashcards() {
      if (!user) return;

      let flashcards = [];

      const docRef = doc(collection(db, "users"), user.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        flashcards = docSnap.data().flashcards || [];
        // Retrieve user's plan information
        setUserPlan(docSnap.data().plan || 'free');
      } else {
        await setDoc(docRef, { flashcards: [], plan: 'free' });
      }

      setFlashcards(flashcards);
    }

    getFlashcards();
  }, [user]);

  const handleAddCollection = () => {
    if (flashcards.length >= 5 && userPlan === 'free') {
      setShowDialog(true);
    } else {
      router.push("/generate");
    }
  };

  const handleCheckout = async (plan) => {
    try {
      const stripe = await getStripe();

      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            { name: `${plan} Plan`, price: plan === 'Basic' ? 500 : 1000, quantity: 1 },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { id } = await response.json();
      await stripe.redirectToCheckout({ sessionId: id });
    } catch (error) {
      console.error('Error during checkout:', error);
      alert(`There was an error during checkout: ${error.message}`);
    }
  };

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
              onClick={() => handleCardClick(flashcard.name)}
            >
              <CardContent>
                <h2 className="text-xl font-semibold">{flashcard.name}</h2>
              </CardContent>
            </Button>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Button onClick={handleAddCollection}>Add New Collection</Button>
        <Link href="/" passHref>
          <Button className="ml-5">Back to Home</Button>
        </Link>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <p className="mb-4">
            You have reached the limit of 5 flashcards. To create more, please upgrade your plan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Basic</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="mb-4 text-3xl font-bold">$5 / month</h3>
                <p className="mb-6 text-muted-foreground">
                  Access to basic card features and limited storage
                </p>
                <Button onClick={() => handleCheckout('Basic')} className="w-full">Choose Basic</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Pro</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="mb-4 text-3xl font-bold">$10 / month</h3>
                <p className="mb-6 text-muted-foreground">
                  Unlimited flashcards and storage with priority support
                </p>
                <Button onClick={() => handleCheckout('Pro')} className="w-full">Choose Pro</Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
