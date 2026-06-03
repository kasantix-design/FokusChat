import { Peergos } from 'peergos';

// Konfigurasjon for Peergos-serveren
// I produksjon vil dette være din skytjeneste (f.eks. https://fokus.no)
// I utvikling (Replit) bruker vi den offentlige testserveren eller localhost
const PEERGOS_SERVER_URL = import.meta.env.VITE_PEERGOS_URL || 'https://peergos.org';

class PeergosService {
  private client: Peergos | null = null;
  private currentUser: string | null = null;

  /**
   * Logger inn bruker på Peergos
   * Merk: Ved passordgjenoppretting vil chat-meldinger være tapt (E2EE)
   */
  async login(username: string, password: string): Promise<void> {
    try {
      // Koble til serveren
      this.client = await Peergos.login(username, password, PEERGOS_SERVER_URL);
      this.currentUser = username;
      console.log(`🟢 Logget inn som ${username}`);
    } catch (error) {
      console.error('❌ Innlogging feilet:', error);
      throw new Error('Kunne ikke logge inn. Sjekk brukernavn og passord.');
    }
  }

  /**
   * Sjekk om brukeren er logget inn
   */
  isLoggedIn(): boolean {
    return this.client !== null;
  }

  /**
   * Hent aktuell bruker
   */
  getCurrentUser(): string | null {
    return this.currentUser;
  }

  /**
   * Hent Peergos-klienten (for direkte API-kall)
   */
  getClient(): Peergos {
    if (!this.client) {
      throw new Error('Ikke logget inn. Kall login() først.');
    }
    return this.client;
  }

  /**
   * Logg ut
   */
  logout(): void {
    this.client = null;
    this.currentUser = null;
    console.log('🔴 Logget ut');
  }

  /**
   * Opprett en ny bruker (hvis serveren tillater det)
   * I vårt tilfelle er dette via invitasjon, så dette kan være begrenset
   */
  async register(username: string, password: string, email: string): Promise<void> {
    // Dette er en forenklet versjon. Peergos krever ofte admin-godkjenning eller invitasjon.
    // Vi antar at serveren vår støtter registrering via invitasjonslenke.
    try {
      // Her ville vi kalt en spesifikk registrerings-endepunkt hvis Peergos SDK støtter det
      // For nå, la oss anta at brukeren allerede er opprettet av admin/inviterer
      throw new Error('Registrering må gjøres via invitasjonslenke fra en eksisterende bruker.');
    } catch (error) {
      throw error;
    }
  }
}

// Singleton-instans
export const peergosService = new PeergosService();
