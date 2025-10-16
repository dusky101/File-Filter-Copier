import React, { useState } from "react";
import { Dialog, DialogHeader, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function PresetNameDialog({ open, onClose, onSave }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      setError("Please enter a preset name.");
      return;
    }
    onSave(name.trim());
    setName("");
    setError("");
  };

  const handleClose = () => {
    setName("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>Save Filter Preset</DialogHeader>

      <div className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Enter a name for your current filter configuration. You can reload
          this preset later from the list.
        </p>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="e.g. Large Recent Files"
          autoFocus
        />
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogFooter>
    </Dialog>
  );
}
