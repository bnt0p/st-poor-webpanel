import { useTranslation } from "@/hooks/useTranslation";

const LoadingPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Animated Logo/Icon */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center animate-glow-pulse">
            <span className="text-4xl animate-float">🏄‍♂️</span>
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-primary/30 rounded-full animate-spin"></div>
        </div>

        {/* Loading Text */}
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t("loading.title")}
          </h2>
          <p className="text-muted-foreground animate-pulse">
            {t("loading.subtitle")}
          </p>
        </div>

        {/* Loading Bar */}
        <div className="w-64 mx-auto">
          <div className="h-2 bg-gaming-surface rounded-full overflow-hidden">
            <div className="h-full bg-gradient-primary rounded-full animate-pulse w-full"></div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 animate-fade-in">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>{t("loading.authenticating")}</span>
          </div>
          <div className="flex items-center justify-center gap-2 animate-fade-in [animation-delay:500ms]">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
            <span>{t("loading.loadingStats")}</span>
          </div>
          <div className="flex items-center justify-center gap-2 animate-fade-in [animation-delay:1000ms]">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>{t("loading.loadingSurf")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;