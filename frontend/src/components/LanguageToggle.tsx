import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Languages, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LABELS: Record<'en' | 'ptbr' | 'tr', string> = {
  en: 'EN',
  ptbr: 'PT',
  tr: 'TR',
};

const LanguageToggle = () => {
  const { language, setLanguage } = useTranslation(); // language should be 'en' | 'ptbr' | 'tr'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-primary/50 hover:bg-primary/10 flex items-center gap-2"
        >
          <Languages className="h-4 w-4" />
          {LABELS[language as 'en' | 'ptbr' | 'tr'] ?? 'EN'}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="bg-background">
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className={language === 'en' ? 'bg-accent' : ''}
        >
          English
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setLanguage('ptbr')}
          className={language === 'ptbr' ? 'bg-accent' : ''}
        >
          Português (BR)
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setLanguage('tr')}
          className={language === 'tr' ? 'bg-accent' : ''}
        >
          Türkçe
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageToggle;
