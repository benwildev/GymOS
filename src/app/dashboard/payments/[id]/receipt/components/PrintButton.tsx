"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button 
      onClick={() => window.print()} 
      className="bg-black hover:bg-gray-800 text-white gap-2 shadow-xs"
    >
      <Printer className="w-4 h-4" />
      Print Receipt
    </Button>
  );
}
