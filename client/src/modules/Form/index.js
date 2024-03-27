import React, { useState } from "react";
import Input from "../../components/Input";
import { Button } from "../../components/Button";
import { useNavigate } from "react-router-dom";

export default function Form({ isSignedIn = true }) {
  const [data, setData] = useState({
    fullName: !isSignedIn ? undefined : "", // Set fullName to undefined only when isSignedIn is false
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    console.log("data", data);
    e.preventDefault();

    try {
      const res = await fetch(
        `https://chatmessage-server.vercel.app/${
          isSignedIn ? "login" : "register"
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      // Log additional information for debugging
      console.log("Request URL:", res.url);
      console.log("Request Payload:", JSON.stringify(data));

      if (!res.ok) {
        // Handle error, e.g., display an error message to the user
        console.error("Error during fetch:", res.status, res.statusText);
        return;
      }

      const contentType = res.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const resData = await res.json();
        console.log("Response data:", resData);

        if (resData.token) {
          localStorage.setItem("user:token", resData.token);

          // Store user details as separate key-value pairs
          localStorage.setItem("user:detail", JSON.stringify(resData.user));

          navigate("/");
        }
      } else {
        console.error("Invalid response content type:", contentType);
        // Handle non-JSON responses as needed
      }
    } catch (error) {
      // Handle other types of errors, e.g., network errors
      console.error("Error during fetch:", error);
    }
  };

  return (
    <div className="bg-light h-screen flex items-center justify-center">
      <div className="bg-white w-[400px] h-[600px] shadow-lg rounded-lg flex flex-col justify-center items-center">
        <div className="text-4xl font-extralight">
          Welcome {isSignedIn && "Back"}
        </div>
        <div className="text-xl font-light mb-3">
          {isSignedIn
            ? "Sign In to get explored"
            : "Sign Up now to get started"}
        </div>
        <form
          className="flex flex-col items-center w-full"
          onSubmit={handleSubmit}
        >
          {!isSignedIn && (
            <Input
              label="Full Name"
              name="Your Full Name"
              placeholder="Input your Full Name"
              className="mb-6 w-[75%]"
              value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
            />
          )}

          <Input
            label="Email"
            type="email"
            name="Your Email"
            placeholder="Input your Email"
            className="mb-6 w-[75%]"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <Input
            label="Password"
            name="Your Password"
            type="password"
            placeholder="Input your Password"
            className="mb-8 w-[75%]"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
          <Button
            label={isSignedIn ? "Sign In" : "Sign Up"}
            className="w-1/2 mb-2"
            type="submit"
          />
        </form>

        <div>
          {isSignedIn ? "Didn't have an account" : "Already have an account"}
          <span
            className="text-primary cursor-pointer underline"
            onClick={() => navigate(`/${isSignedIn ? "signup" : "login"}`)}
          >
            {" "}
            {isSignedIn ? "Sign Up" : "Sign In"}
          </span>
        </div>
      </div>
    </div>
  );
}
