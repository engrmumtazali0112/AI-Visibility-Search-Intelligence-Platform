def _get_client(self):
    """Initialize AI client - Anthropic is primary."""
    if self._client is not None:
        return self._client
    
    # Check Mock mode first
    if current_app.config.get("MOCK_AI", False):
        return "mock"
    
    # Primary: Anthropic Claude
    api_key = current_app.config.get("ANTHROPIC_API_KEY")
    if api_key and api_key != "sk-ant-demo-key":
        try:
            import anthropic
            return anthropic.Anthropic(api_key=api_key)
        except Exception as e:
            logger.warning(f"Anthropic init failed: {e}")
    
    # Fallback to Gemini
    api_key = current_app.config.get("GOOGLE_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            return genai
        except Exception as e:
            logger.warning(f"Gemini init failed: {e}")
    
    # Fallback to OpenAI
    api_key = current_app.config.get("OPENAI_API_KEY")
    if api_key:
        try:
            import openai
            openai.api_key = api_key
            return openai
        except Exception as e:
            logger.warning(f"OpenAI init failed: {e}")
    
    raise AgentError(self.agent_name, "No AI API key configured")