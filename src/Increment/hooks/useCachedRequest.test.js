import React from "react";
import { render, cleanup, waitForElement } from "react-testing-library";
import Axios from "axios";

import cache from "../lib/cache";
import useCachedRequest from "./useCachedRequest";

// Annoying Warning FIX PR: https://github.com/facebook/react/pull/14853

jest.mock("axios");

// Example Component using the useCachedRequest hook
function Person({ id }) {
  const { data, loading } = useCachedRequest(
    `https://review-rocket.podium.com/api/v1/users/${id}`
  );

  if (loading) return <div>loading</div>;

  return (
    <>
      <div>{data.name}</div>
      <div>{data.email}</div>
    </>
  );
}

const arthur = {
  id: "1",
  name: "Arthur",
  email: "adog@factsaboutme.com"
};

const eric = {
  id: "2",
  name: "Eric",
  email: "i-am-ceo@podium.com"
};

beforeAll(() => {
  Axios.get.mockImplementation(url => {
    const idMap = {
      "https://review-rocket.podium.com/api/v1/users/1": arthur,
      "https://review-rocket.podium.com/api/v1/users/2": eric
    };

    const data = idMap[url];

    return Promise.resolve({ data });
  });
});

afterEach(() => {
  cleanup();
  cache.clear();
});

test("requests get cached after they run", async () => {
  const { getByText, queryByText, rerender } = render(<Person id="1" />);
  expect(getByText("loading")).toBeInTheDocument();
  await waitForElement(() => getByText(arthur.name));
  expect(getByText(arthur.email)).toBeInTheDocument();

  rerender(<Person id="2" />);
  expect(getByText("loading")).toBeInTheDocument();
  await waitForElement(() => getByText(eric.name));
  expect(getByText(eric.email)).toBeInTheDocument();

  rerender(<Person id="1" />);
  expect(queryByText("loading")).not.toBeInTheDocument();
  expect(getByText(arthur.name)).toBeInTheDocument();
  expect(getByText(arthur.email)).toBeInTheDocument();

  rerender(<Person id="2" />);
  expect(queryByText("loading")).not.toBeInTheDocument();
  expect(getByText(eric.name)).toBeInTheDocument();
  expect(getByText(eric.email)).toBeInTheDocument();
});
