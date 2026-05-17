import { Souverain } from "../../../src/monark/core/souverain";

export default async function handler(req, res) {
  const souverain = new Souverain();
  const decision = await souverain.statuer(req.body);

  res.status(200).json({
    lignesFutur: decision.lignesFutur,
    trajectoire: decision.trajectoire
  });
}
