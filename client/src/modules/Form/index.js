import React, { useState } from "react";
import Input from "../../components/Input";
import { Button } from "../../components/Button";
import { useNavigate } from "react-router-dom";

export default function Form({ isSignedIn = true }) {
  const [data, setData] = useState({
    fullName: !isSignedIn ? undefined : "", // Set fullName to undefined only when isSignedIn is false
    email: "",
    password: "",
    img: null,
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Gunakan FormData untuk mengirim data
    const formData = new FormData();
    formData.append("fullName", data.fullName);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("img", data.img);

    try {
      const url = `http://127.0.0.1:8000/api/${
        isSignedIn ? "login" : "register"
      }`;

      let options = {
        method: "POST",
      };

      if (isSignedIn) {
        // Jika login, kirim data sebagai JSON
        options.headers = {
          "Content-Type": "application/json",
        };
        options.body = JSON.stringify(data);
      } else {
        // Jika register, kirim data sebagai formData
        options.body = formData;
      }

      const res = await fetch(url, options);

      console.log("Request URL:", res.url);

      // Cek konten tipe
      const contentType = res.headers.get("Content-Type");
      console.log("Content-Type:", contentType);

      if (!res.ok) {
        // Tangani kesalahan, misalnya menampilkan pesan kesalahan kepada pengguna
        console.error("Error during fetch:", res.status, res.statusText);
        return;
      }

      // Jika respons JSON, parse JSON
      if (contentType && contentType.includes("application/json")) {
        const resData = await res.json();
        console.log("Response data:", resData);

        if (resData.token) {
          localStorage.setItem("user:token", resData.token);
          localStorage.setItem("user:detail", JSON.stringify(resData.user));
          navigate("/");
        }
      } else {
        console.error("Invalid response content type:", contentType);
        // Tangani respons non-JSON seperti yang diperlukan
      }
    } catch (error) {
      // Tangani kesalahan lain, seperti kesalahan jaringan
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

          {!isSignedIn && (
            <div className="mb-6 w-[75%]">
              <label
                htmlFor="imgUpload"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Upload Image
              </label>
              <input
                type="file"
                id="imgUpload"
                className="border border-gray-300 rounded p-2 w-full"
                accept="image/*" // Hanya menerima file gambar
                onChange={(e) => {
                  // Perbarui state data dengan file gambar yang diunggah
                  setData({ ...data, img: e.target.files[0] });
                }}
              />
            </div>
          )}

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
