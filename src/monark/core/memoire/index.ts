export type EntreeMemoire = {
  horodatage: string;
  type: string;
  tension: number;
  stabilite: number;
  verdict?: any;
};

export type EtatMemoire = {
  entrees: EntreeMemoire[];
  tailleMax: number;
  mode: "adaptatif";
};

export class MemoireCollective {
  private etat: EtatMemoire = {
    entrees: [],
    tailleMax: 100,
    mode: "adaptatif"
  };

  async enregistrer(decision: any) {
    const entree: any = {
      horodatage: decision.horodatage || new Date().toISOString(),
      type: decision.type,
      tension: decision.tension,
      stabilite: decision.stabilite,
      verdict: decision.verdict,
      oracles: decision.oracles,
      influences: decision.influences,
      pouvoirs: decision.pouvoirs,
      flux: decision.flux,
      dynamiques: decision.dynamiques,
      signaux: decision.signaux,
      conscience: decision.conscience,
      lignesFutur: decision.lignesFutur,
      trajectoire: decision.trajectoire,
      plans: decision.plans,
      apprentissage: decision.apprentissage,
      securite: decision.securite,
      architecture: decision.architecture,
      dashboard: decision.dashboard,
      optimisation: decision.optimisation,
      memoire: decision.memoire
    };

    this.etat.entrees.push(entree);
    this.ajusterTaille(entree);
    this.compacter();
  }

  getEtat() {
    return this.etat;
  }

  private ajusterTaille(entree: EntreeMemoire) {
    const tension = entree.tension;
    const stabilite = entree.stabilite;

    if (tension > 0.7) {
      this.etat.tailleMax = 30;
    } else if (tension > 0.4) {
      this.etat.tailleMax = 60;
    } else if (stabilite > 0.7) {
      this.etat.tailleMax = 200;
    } else {
      this.etat.tailleMax = 100;
    }
  }

  private compacter() {
    const surplus = this.etat.entrees.length - this.etat.tailleMax;
    if (surplus > 0) {
      this.etat.entrees.splice(0, surplus);
    }
  }
}
