export const callOpenAI = async (apiKey, model, systemPrompt, userPrompt, jsonMode = false) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: jsonMode ? { type: 'json_object' } : undefined
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `OpenAI API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const callAnthropic = async (apiKey, model, systemPrompt, userPrompt, jsonMode = false) => {
  // Anthropic does not support standard response_format=json_object in the same way, 
  // so we rely on prompt engineering for JSON output.
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Anthropic API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
};

export const callGemini = async (apiKey, model, systemPrompt, userPrompt, jsonMode = false) => {
  // Use the standard v1beta endpoint
  const modelName = model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `System Instruction:\n${systemPrompt}\n\nUser Input:\n${userPrompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: jsonMode ? 'application/json' : 'text/plain'
      }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Gemini API Error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned an empty response.');
  }
  return text;
};

export const callAI = async (settings, systemPrompt, userPrompt, jsonMode = false) => {
  const { apiKey, provider, model } = settings;
  if (!apiKey) {
    throw new Error('API Key is missing. Please configure it in Settings.');
  }

  switch (provider) {
    case 'openai':
      return await callOpenAI(apiKey, model, systemPrompt, userPrompt, jsonMode);
    case 'anthropic':
      return await callAnthropic(apiKey, model, systemPrompt, userPrompt, jsonMode);
    case 'gemini':
      return await callGemini(apiKey, model, systemPrompt, userPrompt, jsonMode);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};
