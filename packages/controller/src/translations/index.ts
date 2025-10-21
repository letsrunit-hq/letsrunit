import af from './af';
import ar from './ar';
import az from './az';
import bg from './bg';
import bn from './bn';
import bs from './bs';
import ca from './ca';
import cs from './cs';
import da from './da';
import de from './de';
import el from './el';
import en from './en';
import es from './es';
import et from './et';
import eu from './eu';
import fa from './fa';
import fi from './fi';
import fr from './fr';
import ga from './ga';
import he from './he';
import hi from './hi';
import hr from './hr';
import hu from './hu';
import hy from './hy';
import id from './id';
import is from './is';
import it from './it';
import ja from './ja';
import ka from './ka';
import ko from './ko';
import lt from './lt';
import lv from './lv';
import nl from './nl';
import no from './no';
import pl from './pl';
import pt from './pt';
import ro from './ro';
import ru from './ru';
import sk from './sk';
import sl from './sl';
import sv from './sv';
import sw from './sw';
import ta from './ta';
import th from './th';
import tl from './tl';
import tr from './tr';
import uk from './uk';
import ur from './ur';
import vi from './vi';
import zh from './zh';

export const languages = {
  af, ar, az, bg, bn, bs, ca, cs, da, de, el, en, es, et, eu, fa, fi, fr, ga, he, hi, hr, hu, hy, id, is, it, ja, ka,
  ko, lt, lv, nl, no, pl, pt, ro, ru, sk, sl, sv, sw, ta, th, tl, tr, uk, ur, vi, zh,
} as const;

export type Lang = keyof typeof languages;

export function normalizeLang(input: string): Lang {
  const code = input.toLowerCase() as keyof typeof languages;
  if (code in languages) return code as Lang;
  return 'en';
}

export function getTranslations(lang: string): { accept: string[], reject: string[], close: string[] } {
  const code = normalizeLang(lang);
  return languages[code];
}
