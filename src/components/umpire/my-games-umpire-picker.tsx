"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UmpireOption = {
  id: string;
  name: string;
};

type Props = {
  umpires: UmpireOption[];
  selectedUmpireId: string;
};

const STORAGE_KEY = "umpireMyGamesSelectedUmpireId";

export default function MyGamesUmpirePicker({
  umpires,
  selectedUmpireId,
}: Props) {
  const router = useRouter();
  const [localSelectedUmpireId, setLocalSelectedUmpireId] = useState(selectedUmpireId);

  useEffect(() => {
    setLocalSelectedUmpireId(selectedUmpireId);
  }, [selectedUmpireId]);

  useEffect(() => {
    if (selectedUmpireId) {
      localStorage.setItem(STORAGE_KEY, selectedUmpireId);
      return;
    }

    const remembered = localStorage.getItem(STORAGE_KEY);
    if (!remembered) return;

    const stillExists = umpires.some((umpire) => umpire.id === remembered);
    if (!stillExists) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    router.replace(`/umpire-my-games?umpireId=${remembered}`);
  }, [selectedUmpireId, umpires, router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!localSelectedUmpireId) return;

    localStorage.setItem(STORAGE_KEY, localSelectedUmpireId);
    router.push(`/umpire-my-games?umpireId=${localSelectedUmpireId}`);
  }

  function handleClear() {
    localStorage.removeItem(STORAGE_KEY);
    setLocalSelectedUmpireId("");
    router.push("/umpire-my-games");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "minmax(260px, 420px) auto",
          alignItems: "end",
        }}
      >
        <div>
          <label
            htmlFor="umpireId"
            style={{
              display: "block",
              marginBottom: "0.35rem",
              fontWeight: 600,
              color: "#334155",
            }}
          >
            Umpire
          </label>
          <select
            id="umpireId"
            name="umpireId"
            value={localSelectedUmpireId}
            onChange={(e) => setLocalSelectedUmpireId(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 0.9rem",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              fontSize: "0.95rem",
            }}
          >
            <option value="">Select an umpire</option>
            {umpires.map((umpire) => (
              <option key={umpire.id} value={umpire.id}>
                {umpire.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={!localSelectedUmpireId}
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: !localSelectedUmpireId ? "#94a3b8" : "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              cursor: !localSelectedUmpireId ? "not-allowed" : "pointer",
            }}
          >
            View Games
          </button>

          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: "#f8fafc",
              border: "1px solid #dbe3f0",
              borderRadius: "10px",
              color: "#475569",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </form>
  );
}