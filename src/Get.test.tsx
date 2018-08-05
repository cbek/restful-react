import "isomorphic-fetch";
import "jest-dom/extend-expect";
import nock from "nock";
import React from "react";
import { cleanup, render, wait } from "react-testing-library";

import { Get, RestfulProvider } from "./index";

afterEach(() => {
  cleanup();
  nock.cleanAll();
});

describe("Get", () => {
  describe("classic usage", () => {
    it("should call the url set in provider", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(200);

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Get path="">{children}</Get>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
    });

    it("should compose the url with the base", async () => {
      nock("https://my-awesome-api.fake")
        .get("/plop")
        .reply(200);

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Get path="/plop">{children}</Get>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
    });

    it("should set loading to `true` on mount", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(200);

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Get path="">{children}</Get>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[0][1].loading).toEqual(true);
    });

    it("should set loading to `false` on data", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(200, { hello: "world" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Get path="">{children}</Get>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][1].loading).toEqual(false);
    });

    it("should send data on data", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(200, { hello: "world" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Get path="">{children}</Get>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][0]).toEqual({ hello: "world" });
    });
  });

  describe("with error", () => {
    it("should set the `error` object properly", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(401, { message: "You shall not pass!" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Get path="">{children}</Get>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][0]).toEqual(null);
      expect(children.mock.calls[1][1].error).toEqual({
        data: { message: "You shall not pass!" },
        message: "Failed to fetch: 401 Unauthorized",
      });
    });
  });

  describe("with custom resolver", () => {
    it("should transform data", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(200, { hello: "world" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Get path="" resolve={data => ({ ...data, foo: "bar" })}>
            {children}
          </Get>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][0]).toEqual({ hello: "world", foo: "bar" });
    });
  });

  describe("with lazy", () => {
    it("should not fetch on mount", async () => {
      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Get path="" lazy>
            {children}
          </Get>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(1));
      expect(children.mock.calls[0][1].loading).toBe(false);
      expect(children.mock.calls[0][0]).toBe(null);
    });
  });

  describe("actions", () => {
    it("should refetch", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(200, { id: 1 });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      // initial fetch
      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Get path="">{children}</Get>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][1].loading).toEqual(false);
      expect(children.mock.calls[1][0]).toEqual({ id: 1 });

      // refetch
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(200, { id: 2 });
      children.mock.calls[1][2].refetch();
      await wait(() => expect(children.mock.calls.length).toBe(4));

      // transition state
      expect(children.mock.calls[2][1].loading).toEqual(true);
      expect(children.mock.calls[2][0]).toEqual({ id: 1 });

      // after refetch state
      expect(children.mock.calls[3][1].loading).toEqual(false);
      expect(children.mock.calls[3][0]).toEqual({ id: 2 });
    });
  });
});