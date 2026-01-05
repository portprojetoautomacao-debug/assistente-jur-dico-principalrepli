import { Router } from "express";

const router = Router();

interface Lawyer {
  id: string;
  name: string;
  oabNumber: string;
  oabUF: string;
  active: boolean;
}

const DEFAULT_LAWYERS: Lawyer[] = [
  {
    id: "1",
    name: "Thiago Bodevan Veiga",
    oabNumber: "184404",
    oabUF: "MG",
    active: true,
  },
];

let lawyers = [...DEFAULT_LAWYERS];

router.get("/", (_req, res) => {
  res.json(lawyers);
});

router.post("/", (req, res) => {
  const { name, oabNumber, oabUF, active = true } = req.body;

  if (!name || !oabNumber || !oabUF) {
    return res.status(400).json({ error: "Nome, número da OAB e UF são obrigatórios" });
  }

  const newLawyer: Lawyer = {
    id: Date.now().toString(),
    name,
    oabNumber,
    oabUF,
    active,
  };

  lawyers.push(newLawyer);
  res.status(201).json(newLawyer);
});

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const index = lawyers.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Advogado não encontrado" });
  }

  lawyers[index] = { ...lawyers[index], ...req.body };
  res.json(lawyers[index]);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const index = lawyers.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Advogado não encontrado" });
  }

  lawyers.splice(index, 1);
  res.status(204).send();
});

export default router;
