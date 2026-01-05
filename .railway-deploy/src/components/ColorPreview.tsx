/**
 * Color Preview Component
 * Para testar o novo tema azul e branco
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BLUE_SHADES: { shade: number; className: string; accentIndex: number }[] = [
  { shade: 50, className: "bg-blue-50", accentIndex: 1 },
  { shade: 100, className: "bg-blue-100", accentIndex: 2 },
  { shade: 200, className: "bg-blue-200", accentIndex: 3 },
  { shade: 300, className: "bg-blue-300", accentIndex: 4 },
  { shade: 400, className: "bg-blue-400", accentIndex: 5 },
  { shade: 500, className: "bg-blue-500", accentIndex: 6 },
  { shade: 600, className: "bg-blue-600", accentIndex: 7 },
  { shade: 700, className: "bg-blue-700", accentIndex: 8 },
  { shade: 800, className: "bg-blue-800", accentIndex: 9 },
  { shade: 900, className: "bg-blue-900", accentIndex: 10 },
  { shade: 950, className: "bg-blue-950", accentIndex: 10 },
];

export function ColorPreview() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-primary mb-2">Tema Azul e Branco</h1>
        <p className="text-muted-foreground">Novo esquema de cores profissional e moderno</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Primário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full">Botão Primário</Button>
              <Badge>Badge Primário</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="text-secondary-foreground">Secundário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full">
                Botão Secundário
              </Button>
              <Badge variant="secondary">Badge Secundário</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-accent-foreground">Accent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Botão Outline
              </Button>
              <Badge variant="outline">Badge Outline</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paleta de Cores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-11 gap-2">
            {BLUE_SHADES.map(({ shade, className, accentIndex }) => (
              <div key={shade} className="space-y-1">
                <div
                  className={`h-16 rounded-md border border-border ${className}`}
                  // Usa a variável de tema como cor principal;
                  // Tailwind blue fica como fallback/suporte visual se a var não existir.
                  style={{ backgroundColor: `var(--color-accent-${accentIndex})` }}
                />
                <p className="text-xs text-center text-muted-foreground">{shade}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
