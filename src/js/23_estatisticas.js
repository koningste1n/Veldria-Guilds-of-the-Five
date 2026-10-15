/* ============================ ESTATÍSTICAS ============================ */
function mvpDe(meus) {
  let mvp = meus[0];
  for (const u of meus) if (u.dano + u.cura * 1.2 > mvp.dano + mvp.cura * 1.2) mvp = u;
  return mvp;
}
function registrarEstatisticas(b, res, vit) {
  const S = STATE.stats, meus = res.unidades[0], mvp = mvpDe(meus);
  for (const u of meus) {
    S.dano += Math.round(u.dano); S.cura += Math.round(u.cura); S.abates += u.abates; if (!u.vivo) S.mortes++;
    S.maiorGolpe = Math.max(S.maiorGolpe, Math.round(u.maiorGolpe || 0));
    const m = mercPorId(u.merc.id); if (!m) continue;
    const ms = m.stats || (m.stats = statsMercPadrao());
    ms.lutas++; if (vit) ms.vitorias++; ms.abates += u.abates; ms.dano += Math.round(u.dano); ms.cura += Math.round(u.cura); if (u === mvp) ms.mvp++;
  }
  S.supremos += b.supremos ? b.supremos[0] : 0;
  S.tempoLuta += res.tempo;
  return mvp;
}

