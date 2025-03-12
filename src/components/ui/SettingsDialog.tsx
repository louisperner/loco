import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FaCog } from 'react-icons/fa';

interface SettingsDialogProps {
  children?: React.ReactNode;
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="fixed top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 border border-white/10">
          <FaCog className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-black/40 backdrop-blur-xl border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription className="text-white/70">
            Personalize sua experiência no espaço virtual.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
        <DialogFooter>
          <Button type="submit" variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 