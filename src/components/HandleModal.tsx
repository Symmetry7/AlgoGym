import React, { useEffect, useState } from "react";
import usePersistentState from "../hooks/usePersistentState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface HandleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const backdropClass =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm";
const closeBtnClass =
  "absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

const HandleModal: React.FC<HandleModalProps> = ({ isOpen, onClose }) => {
  const [cfHandle, setCfHandle] = usePersistentState<string>("cfHandle", "");
  const [lcHandle, setLcHandle] = usePersistentState<string>("lcHandle", "");
  const [cfInput, setCfInput] = useState(cfHandle);
  const [lcInput, setLcInput] = useState(lcHandle);

  useEffect(() => {
    if (isOpen) {
      setCfInput(cfHandle);
      setLcInput(lcHandle);
    }
  }, [isOpen, cfHandle, lcHandle]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCfHandle(cfInput.trim());
    setLcHandle(lcInput.trim());
    onClose();
  };

  return (
    <div className={backdropClass}>
      <Card className="relative w-full max-w-md border bg-background text-foreground shadow-lg rounded-lg">
        <button className={closeBtnClass} onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-xl">Enter Your Handles</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="cf-handle">Codeforces Handle</Label>
              <Input
                id="cf-handle"
                type="text"
                placeholder="e.g. tourist"
                value={cfInput}
                onChange={e => setCfInput(e.target.value)}
                autoComplete="off"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lc-handle">LeetCode Handle</Label>
              <Input
                id="lc-handle"
                type="text"
                placeholder="e.g. john_doe"
                value={lcInput}
                onChange={e => setLcInput(e.target.value)}
                autoComplete="off"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full mt-2">Save Handles</Button>
          </form>
          <div className="text-xs text-muted-foreground mt-4 text-center">
            You can skip and set handles later from the menu.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HandleModal;
