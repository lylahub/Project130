// src/authService.js
export const login = async (email, password) => {
  const response = await fetch("http://localhost:3001/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Login failed. Please try again.");
  }

  const data = await response.json();
  return data.userId;
};

export const signUp = async (email, password) => {
  const response = await fetch("http://localhost:3001/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Signup failed. Please try again.");
  }

  const data = await response.json();
  return data.userId;
};
