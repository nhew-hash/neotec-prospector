"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { AppSettings } from "@/types";

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const router = useRouter();
  const [weights, setWeights] = useState(settings.score_weights);
  const [scoreQuenteMin, setScoreQuenteMin] = useState(settings.score_quente_min);
  const [scoreMornoMin, setScoreMornoMin] = useState(settings.score_morno_min);
  const [raioPadrao, setRaioPadrao] = useState(settings.raio_padrao_km);
  const [quantidadePadrao, setQuantidadePadrao] = useState(settings.quantidade_padrao);
  const [comissaoPadrao, setComissaoPadrao] = useState(settings.comissao_pct_padrao);
  const [valorVendaPadrao, setValorVendaPadrao] = useState(settings.valor_venda_padrao);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setWeight(key: keyof typeof weights, value: number) {
    setWeights((w) => ({ ...w, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score_weights: weights,
          score_quente_min: scoreQuenteMin,
          score_morno_min: scoreMornoMin,
          raio_padrao_km: raioPadrao,
          quantidade_padrao: quantidadePadrao,
          comissao_pct_padrao: comissaoPadrao,
          valor_venda_padrao: valorVendaPadrao,
        }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Algoritmo de score (0–100)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Sem site (+pts)</Label>
            <Input type="number" value={weights.sem_site} onChange={(e) => setWeight("sem_site", Number(e.target.value))} />
          </div>
          <div>
            <Label>Google Profile ativo (+pts)</Label>
            <Input type="number" value={weights.google_profile_ativo} onChange={(e) => setWeight("google_profile_ativo", Number(e.target.value))} />
          </div>
          <div>
            <Label>Muitas avaliações (+pts)</Label>
            <Input type="number" value={weights.muitas_avaliacoes} onChange={(e) => setWeight("muitas_avaliacoes", Number(e.target.value))} />
          </div>
          <div>
            <Label>Limite de avaliações para considerar &quot;muitas&quot;</Label>
            <Input type="number" value={weights.muitas_avaliacoes_threshold} onChange={(e) => setWeight("muitas_avaliacoes_threshold", Number(e.target.value))} />
          </div>
          <div>
            <Label>Instagram ativo (+pts)</Label>
            <Input type="number" value={weights.instagram_ativo} onChange={(e) => setWeight("instagram_ativo", Number(e.target.value))} />
          </div>
          <div>
            <Label>Telefone/WhatsApp (+pts)</Label>
            <Input type="number" value={weights.telefone_whatsapp} onChange={(e) => setWeight("telefone_whatsapp", Number(e.target.value))} />
          </div>
          <div>
            <Label>Operação estabelecida (+pts)</Label>
            <Input type="number" value={weights.operacao_estabelecida} onChange={(e) => setWeight("operacao_estabelecida", Number(e.target.value))} />
          </div>
          <div>
            <Label>Segmento de alta necessidade (+pts)</Label>
            <Input type="number" value={weights.segmento_alta_necessidade} onChange={(e) => setWeight("segmento_alta_necessidade", Number(e.target.value))} />
          </div>
          <div>
            <Label>Presença digital fraca (+pts)</Label>
            <Input type="number" value={weights.presenca_fraca} onChange={(e) => setWeight("presenca_fraca", Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classificação de temperatura</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Score mínimo para 🔥 Quente</Label>
            <Input type="number" value={scoreQuenteMin} onChange={(e) => setScoreQuenteMin(Number(e.target.value))} />
          </div>
          <div>
            <Label>Score mínimo para 🟡 Morno</Label>
            <Input type="number" value={scoreMornoMin} onChange={(e) => setScoreMornoMin(Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prospecção e comissão</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Raio padrão (km)</Label>
            <Input type="number" value={raioPadrao} onChange={(e) => setRaioPadrao(Number(e.target.value))} />
          </div>
          <div>
            <Label>Quantidade padrão de empresas</Label>
            <Input type="number" value={quantidadePadrao} onChange={(e) => setQuantidadePadrao(Number(e.target.value))} />
          </div>
          <div>
            <Label>Comissão padrão (%)</Label>
            <Input type="number" value={comissaoPadrao} onChange={(e) => setComissaoPadrao(Number(e.target.value))} />
          </div>
          <div>
            <Label>Valor padrão da venda (R$)</Label>
            <Input type="number" value={valorVendaPadrao} onChange={(e) => setValorVendaPadrao(Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segmentos e cidades sugeridas</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-sm text-muted space-y-2">
          <p>Segmentos: {settings.segmentos_disponiveis.join(", ")}</p>
          <p>Cidades sugeridas: {settings.cidades_sugeridas.join(", ")}</p>
          <p className="text-xs">
            Para editar a lista de segmentos e cidades, atualize{" "}
            <code className="bg-slate-100 rounded px-1">src/lib/config/default-settings.ts</code> — uma tela de
            edição dedicada pode ser adicionada em uma próxima versão.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
        {saved && <span className="text-sm text-success-500">Salvo com sucesso.</span>}
      </div>
    </div>
  );
}
